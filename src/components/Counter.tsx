import { React } from "../depFront.ts";

export const Counter = () => {
  const [value, setValue] = React.useState(0);
  const increment = React.useCallback(() => {
    setValue(value + 1);
  }, [value]);

  return (
    <div>
      Counter: {value}
      <button onClick={increment}>Increment</button>
    </div>
  );
};
