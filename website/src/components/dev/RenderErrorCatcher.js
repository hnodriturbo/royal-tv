'use client';
import React from 'react';

export default class RenderErrorCatcher extends React.Component {
  componentDidCatch(error, info) {
    // Server & client logs
    console.error(
      '[RenderErrorCatcher]',
      { name: this.props.name, stack: info?.componentStack },
      error
    );
  }
  render() {
    return this.props.children;
  }
}
