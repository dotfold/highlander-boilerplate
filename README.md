
### Requirements:

- Node.js v6.9.1 or greater recommended
- Yarn installed globally
- Commitizen installed globally

### Install Dependencies

```sh
$ yarn
```

### Run

```sh
$ yarn start
```

### Debug Configurations

VSCode

Create a `launch.json` config with the following:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Chrome Webpack",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceRoot}/src",
      "userDataDir": "${workspaceRoot}/.chrome",
      "sourceMapPathOverrides": {
        "webpack:///src/*": "${webRoot}/*"
      }
    }
  ]
}
```

- Start the dev server normally with `yarn start`
- Run the debug config named "Chrome Webpack"
- Wait for the debug chrome window to launch
- Debug happy times

**WebStorm**

Follow the instructions here to create a debug configuration:
https://blog.jetbrains.com/webstorm/2017/01/debugging-react-apps/

### Tests

#### Unit

_Todo_

```sh
$ yarn test
```

See docs/unit.md

#### Functional

_Todo_

```sh
$ yarn run test:e2e
```

E2E tests are written in nightwatch. See docs/test.md.


### Codestyle

```sh
$ yarn run lint
$ yarn run format
```

The following tools are used to achieve almost zero-conf codestyle:

- standard
- prettier (standard variant)
- stylelint
- csscomb

### Flowtype

```sh
$ flow check
```

### Contributing Guidelines

commitizen friendly

IDE / Editor Setup:

VSCode:
- Flow Language Support
- vscode-flow-ide
- Jest
- JS "Standard" Linter
- CSSComb
- Visual Studio Code Commitizen Support

Full details see:
- _todo_ docs/development_setup.md
- _todo_ CONTRIBUTING.md

