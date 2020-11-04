This project was bootstrapped with create-react-app.

### Basic workflow

#### Initial setup

```
git clone git@github.com:enveritas/enveritas-frontend.git
cd enveritas-frontend/
git checkout supply-chain-dashboard
cd projects/supply-chain-dashboard
yarn install

```

#### Development server
```
yarn start
```

#### Create feature branch
```
git checkout -b name-of-the-new-feature
```

### GraphQL

API responses are modeled using the GraphQL schema language.

A GUI can be run by running `yarn graphql` (pointing to `http://localhost:2999`). This allows checking the validity of mocks against the schemas. Standard GraphQL queries are located in `graphql/mocks` and can be used in the GUI.


#### Run eslint
```
yarn lint
```

#### Generate Supply Units/Countries TopoJSON files

You need a source shapefile of all Supply Units. Natural Earth data is used for countries that are not present in the SU shapefile. Run:

```
yarn generate-topojson [source file path]
yarn generate-topojson ./scripts/in/su/su\ of\ central\ america.shp
```

This will generate needed TopoJSON files in `src/map`.

#### Encrypting json file

In order to keep the data safe we are using [crypto-js](https://github.com/brix/crypto-js) to encrypt the json file.

To do this follow the next steps:
1. ensure you have the (git-ignored) file called supply-chain-dataset.json in the `./src/data` folder
2. Run
    ```bash
    yarn encrypt-json
    ```
3. Choose your password in the node input request to save the new encripted file.

Once the app is loaded, the browser will prompt with the password choosen to decrypt the file in the client side and show an alert when password is not valid.
