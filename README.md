# [andrejus.uk](https://andrejus.uk/)

Built and deployed with Google Cloud.

Actual README.md coming eventually. GCP documentation in the meantime.

## Container Registry Images

We'll need a Hugo builder image and a Firebase deployer image for the Cloud Build steps, along with the default gcloud images.

For the Hugo builder image, run the following in Cloud Shell [[1]].
```sh
### Clone community cloud builders repo
git clone https://github.com/andrejusk/cloud-builders-community.git

### Navigate to Hugo (cloud-builders-community)
cd cloud-builders-community/hugo

### Build Hugo image
gcloud builds submit --config cloudbuild.yaml .
```

Firebase deployer image for prod [[1]]. Run after above.
```sh
### Navigate to Firebase (cloud-builders-community)
cd ../firebase

### Permissions fix
chmod +x firebase.bash

### Build Firebase image
gcloud builds submit --config cloudbuild.yaml .
```

## KMS for Production Deployment

The Firebase deployer needs a token to authenticate. Creating a deployment token and encrypting it [[2]]. Run locally or in Cloud Shell.

```sh
### Generate new token to be encrypted
firebase login:ci
```

Run in Cloud Shell.

```sh
### Set token as envrionment variable
TOKEN=<GENERATED_TOKEN>
```

If KMS not used before.
```sh
### Enable Cryptographic Keys service
gcloud services enable cloudkms.googleapis.com
```


```sh
#### Create a keyring for Cloud Build
gcloud kms keyrings create cloudbuilder --location global

#### Create a key for the Firebase token
gcloud kms keys create firebase-token --location global --keyring cloudbuilder --purpose encryption

#### Create the encrypted token
echo -n $TOKEN | gcloud kms encrypt \
  --plaintext-file=- \
  --ciphertext-file=- \
  --location=global \
  --keyring=cloudbuilder \
  --key=firebase-token | base64
```

Now add the encrypted token to the [cloudbuild.yaml](cloudbuild.yaml) definition, as follows.

```yaml
secrets:
- kmsKeyName: 'projects/<PROJECT_ID>/locations/global/keyRings/cloudbuilder/cryptoKeys/firebase-token'
  secretEnv:
    FIREBASE_TOKEN: '<ENCRYPTED_TOKEN>'
```

## IAM for Deployments

The Firebase deployment token was encrypted using a KMS key. By default, the Cloud Builder's service account cannot access other GCP services, and hence cannot access the key to decrypt the token.

To allow Cloud Build to decrypt the key.

Grant `<PROJECT_NUMBER>@cloudbuild.gserviceaccount.com`
the IAM `Cloud KMS CryptoKey Decrypter` role.

To allow Cloud Build to deploy to App Engine.

Grant `<PROJECT_NUMBER>@cloudbuild.gserviceaccount.com`
the IAM `App Engine Admin` role.

## References

[1]: https://robertsahlin.com/serverless-static-blog-powered-by-hugo-github-cloud-build-and-firebase/
[[1]] - R. Sahlin, 
_Serverless Static Blog powered by Hugo, Github, Cloud Build and Firebase_,
August 3, 2018.

[2]: https://github.com/GoogleCloudPlatform/cloud-builders-community/tree/master/firebase
[[2]] - GoogleCloudPlatform,
_cloud-builders-community/firebase_.