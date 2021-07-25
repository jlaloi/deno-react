import React from "react";

export const Counter = () => {
  const [count, setCount] = React.useState(0);
  const increment = React.useCallback(() => {
    setCount(count + 1);
  }, [count]);

  return (
    <div>
      Counter: {count}
      <button onClick={increment}>Increment</button>
    </div>
  );
};
