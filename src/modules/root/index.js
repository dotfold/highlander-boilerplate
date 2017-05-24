/* @flow */
import React from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import { Provider } from 'react-redux'

import './root.less'

type LayoutComponentProps = {
  component: any
}

const Layout = ({ component: Component, ...rest }: LayoutComponentProps) => {
  return (
    <Route
      {...rest}
      render={matchProps => (
        <div>
          <Component {...matchProps} />
        </div>
      )}
    />
  )
}

const c = () => {
  const d = '2'
  console.log(d)
}

const Home = () => (
  <div styleName='welcome-home' onClick={() => c()}>Welcome Home</div>
)

export default function Root ({ store }: { store: any }) {
  return (
    <Provider store={store}>
      <Router>
        <Switch>
          <Layout exact path='/' component={Home} />
        </Switch>
      </Router>
    </Provider>
  )
}
