/* @flow */
import React from 'react'
import ReactDOM from 'react-dom'
import { AppContainer } from 'react-hot-loader'
import { createStore, applyMiddleware, compose } from 'redux'
import Root from './modules/root'

const defaultReducer = (state: any = {}, action: any) => {
  return state
}
const middleware = []
const composeEnhancers =
  (process.env.NODE_ENV === 'production' &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
  compose
const store = createStore(
  defaultReducer,
  composeEnhancers(applyMiddleware(...middleware))
)

const rootEl = document.getElementById('root')
const render = Component =>
  ReactDOM.render(
    <AppContainer>
      <Component store={store} />
    </AppContainer>,
    rootEl
  )

render(Root)
if (module.hot) {
  ;(module.hot: any).accept('./modules/root', () => {
    const NextApp = require('./modules/root').default
    render(NextApp)
  })
}
