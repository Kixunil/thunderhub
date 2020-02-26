# **ThunderHub - Lightning Node Manager**

To run ThunderHub you first need to clone this repository.

```javascript
git clone https://github.com/apotdevin/thunderhub.git
```

## **Requirements**

- Node installed
- Yarn or NPM installed

After cloning the repository, go into both the `/client` and the `/server` folders, and run `yarn` or `npm install` in both of them to get all the necessary modules installed.

## **ThunderHub - Server**

### To get the server running use the following commands

##### This must be done in the `/server` folder.

```javascript
//With yarn:
yarn build
yarn start
```

```javascript
//With npm:
npm run build
npm run start
```

If the server starts succesfully, you should see `info [server.js]: Server ready at http://localhost:3001/` in the terminal

## **ThunderHub - Client**

### To get the React frontend running use the following commands

##### This must be done in the `/client` folder.

```javascript
//With yarn:
yarn start
```

```javascript
//With npm:
npm run start
```

If the frontend starts succesfully, you should see `Compiled successfully! You can now view app in the browser.` in the terminal and a browser window should have opened in your browser.

## **For Development**

If you want to develop on ThunderHub and want hot reloading when you do changes use the following commands

### ThunderHub - Server

```javascript
//With yarn:
yarn build:dev

// In another terminal
yarn dev
```

```javascript
//With npm:
npm run build:dev

// In another terminal
npm run dev
```

### ThunderHub - Client

Running the commands `yarn start` or `npm run start` works for development.

You can also get storybook running for quicker component development.

```javascript
//With yarn:
yarn storybook
```

```javascript
//With npm:
npm run storybook
```
