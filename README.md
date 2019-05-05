# [andrejus.uk](https://andrejus.uk/)

Actual README.md will come eventually.

## Cloud Build using GCP

### Container Registry Images
For Hugo Cloud Build image, run the following in Cloud Shell [[1]].
```sh
### Clone community cloud builders repo
git clone https://github.com/GoogleCloudPlatform/cloud-builders-community.git

### Navigate to Hugo (cloud-builders-community)
cd cloud-builders-community/hugo

### Build Hugo image
gcloud builds submit --config cloudbuild.yaml .
```

Firebase Cloud Build image for deployments [[1]]. Run after above.
```sh
### Navigate to Firebase (cloud-builders-community)
cd ../firebase

### Permissions fix
chmod +x firebase.bash

### Build Firebase image
gcloud builds submit --config cloudbuild.yaml .
```

### KMS for Deployment
Creating encrypted deployment key [[2]]. Run locally or in Cloud Shell.

```sh
### Generate new token to be encrypted
firebase login:ci
```

Run in Cloud Shell.

```sh
### Set token as envrionment variable
TOKEN=<GENERATED_TOKEN>
```

Cryptographic Keys service must be used before and enabled.

```sh
#### Create a keyring for Cloud Build
gcloud kms keyrings create cloudbuilder --location global

#### Create a key for the Firebase token
gcloud kms keys create firebase-token --location global --keyring cloudbuilder --purpose encryption

#### create the encrypted token
echo -n $TOKEN | gcloud kms encrypt \
  --plaintext-file=- \
  --ciphertext-file=- \
  --location=global \
  --keyring=cloudbuilder \
  --key=firebase-token | base64
```

```sh
### Clear environment variable
unset TOKEN
```



## References

[1]: https://robertsahlin.com/serverless-static-blog-powered-by-hugo-github-cloud-build-and-firebase/
[[1]] - R. Sahlin, 
_Serverless Static Blog powered by Hugo, Github, Cloud Build and Firebase_,
August 3, 2018.

[2]: https://github.com/GoogleCloudPlatform/cloud-builders-community/tree/master/firebase
[[2]] - GoogleCloudPlatform,
_cloud-builders-community/firebase_.