+++
title = "Exposing a Feathers.JS HTTP API in Kubernetes using Ingress"
description = ""
tags = [
    "typescript",
    "node.js",
    "k8s",
    "gcp",
]
date = "2018-08-16"
categories = [
    "development",
    "cloud",
]
menu = "main"
+++

## Prelude

This article was published during my time
at Think Engineer, 
where I developed cloud back-ends
for our prototype Internet of Things (IoT) projects.
The article idea came up after we solved
a challenging networking issue, while
debugging our internal IoT platform. 
Original post [here](https://think-engineer.com/blog/cloud-computing/exposing-a-feathers-js-http-api-in-kubernetes-using-ingress).

## Background

Building an Internet of Things project often relies on the 
well-established _client-server architecture_ at scale.
When the term was first used, 
it referred to _users_ as the client,
requesting to run jobs from a _central computer_, i.e. the server. [[1]]
Nowadays, with IoT, clients are the _edge devices_
requesting data to be stored/processed by a server.
Although, in theory, a single server could 
handle a small batch of IoT devices,
a sudden surge of device requests could 
easily overwhelm the server and affect 
availability and data integrity.

This is where distributed computing coupled 
with a microservice architecture comes in.
Using this design approach, 
every type of request a device can send 
may be modelled as a service and deployed
on a cluster of servers, 
otherwise known as _the cloud_.
Microservices are usually exposed
as _RESTful HTTP APIs_, meaning they allow a client
to access and manipulate data through
requests such as GET, POST, PUT and DELETE.

### Feathers.JS

Feathers is an open-source Node.js web framework, 
acting as _a REST and real-time API layer for modern applications_. [[2]]
The latter bit means that it's ideal for building RESTful APIs,
especially using a microservice architecture.
A RESTful API is inherently stateless, which means that 
there may be multiple copies of the API spun up and 
the client shouldn't care which copy they're talking to. 
This is perfect for scalability, since the number of copies
of a device end-point can be adjusted depending on 
how busy the entire system is.

### Kubernetes

Kubernetes is a recent advancement in cloud computing,
allowing seamless deployment, management and scaling
of containerised applications.
It works by letting you define 
the workloads you want to run
and the services you want to expose.
This gives fine-grain control over
how microservices and clients
talk to each other.
From there, workloads can be 
updated, scaled up or down,
depending on how the application is performing.
In one foul swoop, Kubernetes eliminates worries
about setting up, managing and scaling servers/applications,
which is really helpful in rapid prototyping.

#### Ingress

Lastly, what's the point of an API if the devices
don't know who to talk to? 
Ingress is used in Kubernetes to allow inbound connections
to reach the cluster services. [[3]]
In this case, it is configured
using Google Kubernetes Engine (GKE)
to give services
externally-reachable URLs 
and to load balance traffic.



## The Problem

By default, Ingress on GKE 
comes with built-in health checks 
for any services 
you expose using a controller.
This is good for basic workloads, such as an nginx
container, where serving internal server error messages
could lead to sensitive data being leaked.

However, the way Ingress does it by default is 
a bit too simple for a RESTful API:

>All Kubernetes services must serve a 200 page on '/'

By default, Ingress will send an
`HTTP GET` request to `'/'`. 
This is alright for containers such as nginx,
as it will just hit the root of the public directory.

From a RESTful API point of view, Ingress is sending
a `find()` request to the `'/'` service 
(nothing specified before the slash). 
While it would make sense to have a catch-all
`index` service that supports requests on `'/'`,
Feathers.JS explicitly doesn't allow that.

The semi-official reason for this is that 
a slash gets truncated in a service name
so it will result in an empty string, which
makes for a bad service identifier, 
especially when you're doing 
something fancy with it. [[4]]

## The Fix

### Defining a custom health check in Kubernetes

GKE Ingress only falls back 
to its default health check
if there is no custom one specified 
in the workload definitions.
The GKE implementation of Ingress 
pulls custom health checks from 
the `readinessProbe` definition
in a Deployment's contain spec.
This may be defined as follows:

```yml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: restfulapi-deployment
  labels:
    app: restfulapi
spec:
  replicas: 3
  selector:
    matchLabels:
      app: restfulapi
  template:
    metadata:
      labels:
        app: restfulapi
    spec:
      containers:
      - name: bitbucket-thinkengineer-restfulapi
        image: gcr.io/restful-example/bitbucket-thinkengineer-restfulapi:latest
        ports:
        - containerPort: 3030
        envFrom:
         - configMapRef:
             name: config
        # Custom healthcheck for Ingress
        readinessProbe:
          httpGet:
            path: /health
            port: 3030
          initialDelaySeconds: 5
          timeoutSeconds: 5
```

Some forum posts reportedly state that having a `containerPort` defined also helps. From here, your service for the workload may be exposed as normal using Ingress:
```yml
apiVersion: v1
kind: Service
metadata:
  name: restfulapi-service
spec:
  selector:
    app: restfulapi
  type: NodePort
  ports:
  - name: restfulapi
    protocol: TCP
    port: 3030
    targetPort: 3030
```
```yml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  name: ingress
  annotations:
    kubernetes.io/ingress.global-static-ip-name: ingress
    ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
  - host: rest.think-engineer.com
    http:
      paths:
      - path: /*
        backend:
          serviceName: restfulapi-service
          servicePort: 3030
```

### Implementing a custom health check in Feathers.JS

In the above definitions,
you may see that we're now
checking `'/health'` 
as opposed to `'/'`.
Since the service name is 
no longer an empty string,
we can create a Feathers service
to respond to requests send there.
This may be done as follows:

```ts
/* Create Feathers appication */
const restAPI = express(feathers())
restAPI.use(express.json())
.use(express.urlencoded({ extended: true }))
.configure(express.rest())
.configure(socketio())
.use(express.errorHandler())
.use('/rest', restService)

/* Register health API */
.use('/health', {
    async find(params) { 
        return `restAPI still alive`
    }
})

/* Start the server */
.listen(API_PORT).on('listening', () =>
    console.log(`restAPI listening on ${API_URL}`)
)
```

The newly created `'/health'` 
service is quite simple - 
it simply returns a string, 
along with a 200 status code.
This is enough to satisfy Ingress
and make the health check pass
to get traffic routed
to your service/workload.



## Conclusion

Overall, when prototyping, 
you tend to work with new 
technologies that may not have
necessarily been designed to work together.
I know in this case the only thing 
I had to go on were GitHub issues.
Although it seems like 
a straight-forward fix,
figuring it out was a massive _gotcha_.
I've talked to some Kubernetes developers
about Ingress ever since and they've
seemed to agree that its implementation
on GKE tends to cause 
a lot of problems such as this.



## References
[1]: https://tools.ietf.org/html/rfc5
[[1]] - 
J. Rulifson, 
"Decode Encode LAnguage (DEL)", 
Network Working Group RFC-5, 
June 2 1969. 
[[Online](https://tools.ietf.org/html/rfc5)].

[2]: https://github.com/feathersjs/feathers
[[2]] - 
Feathers Contributors, 
Feathers.JS, 
Feathers. 
[[Online](https://github.com/feathersjs/feathers)].

[3]: https://kubernetes.io/docs/concepts/services-networking/ingress/
[[3]] - 
The Kubernetes Authors,
"Ingress", 
Kubernetes. 
[[Online](https://kubernetes.io/docs/concepts/services-networking/ingress/)].

[4]: https://github.com/feathersjs/feathers/issues/728#issuecomment-355350349
[[4]] - 
keesee, daffl, 
"Service at root. '/'", 
Feathers. 
[[Online](https://github.com/feathersjs/feathers/issues/728#issuecomment-355350349)].
