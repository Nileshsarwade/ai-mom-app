import { useEffect } from "react";
import axios from "axios";

function app() {
  useEffect(() => {
    axios
      .get("http://localhost:3000")
      .then((response) => {
        console.log(response.data);
      })
      .catch((error) => {
        console.log("error");
      });
  });

  return (
    <div>
      <h1>AI MOM App</h1>
    </div>
  );
}

export default app;
