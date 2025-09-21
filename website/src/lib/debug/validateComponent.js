// validateComponent.js
// ✅ Runtime validator for React components
export default function validateComponent(Component, name = 'Component') {
  const isFn = typeof Component === 'function';

  if (!isFn) {
    // ❌ Invalid: log details + throw
    console.error(`[validateComponent] ❌ ${name} is NOT a React component`);
    console.error(`[validateComponent] typeof=`, typeof Component, Component);
    throw new Error(`[validateComponent] ${name} is not a React component`);
  }

  // ✅ Valid: log confirmation
  console.log(`[validateComponent] ✅ ${name} is a valid React component`);
  return Component;
}
