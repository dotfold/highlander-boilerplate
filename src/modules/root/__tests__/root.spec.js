/* @flow */
import React from 'react'
import renderer from 'react-test-renderer'
import Root from '../'

describe('<Root />', () => {
  const mockStore = {
    subscribe: jest.fn(),
    dispatch: jest.fn(),
    getState: jest.fn()
  }
  it('should render correctly', () => {
    const root = renderer.create(<Root store={mockStore} />).toJSON()
    expect(root).toMatchSnapshot()
  })
})
