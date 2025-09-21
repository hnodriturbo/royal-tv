// /src/lib/debug/assertIsComponent.js
// 🧪 log if the imported "component" isn't a function or string
export function assertIsComponent(possibleComponent, debugName) {
  const isValid = typeof possibleComponent === 'function' || typeof possibleComponent === 'string';
  if (!isValid) {
    // ⚠️ log the actual thing you're trying to render

    console.error(
      `[assertIsComponent] ${debugName} is not a valid React component:`,
      possibleComponent
    );
  }
  return possibleComponent;
}
