import { React } from "../dep.ts";

export const Data = () => {
  const [data, setData] = React.useState<string[]>([]);
  const [newData, setNewData] = React.useState<string>();

  React.useEffect(() => {
    let cancel = false;
    fetch("/api").then((response) => response.json()).then((json) => {
      if (!cancel) setData(json.data);
    });
    return () => {
      cancel = true;
    };
  }, []);

  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    const response = await fetch(
      new Request("/api", {
        headers: new Headers({
          Accept: "application/json",
          "Content-Type": "application/json",
        }),
        method: "POST",
        body: JSON.stringify({ newData }),
      }),
    );
    const json = await response.json();
    setData(json.data);
    setNewData("");
  };

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    //@ts-ignore: type issue
    setNewData(event.target.value);
  };

  return <>
    <h2>Data</h2>
    <ul>{data.map((d) => <li>{d}</li>)}</ul>
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={newData}
        onChange={onChange}
      />
      <input type="submit" />
    </form>
  </>;
};
