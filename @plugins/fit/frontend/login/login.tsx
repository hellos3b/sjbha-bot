import { useEffect } from "preact/hooks";

const checkLogin = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  const res = await fetch(`login`, {
    method: "POST",
    body: JSON.stringify({token}),
    headers: { "Content-Type": "application/json" }
  });

  switch (res.status) {
    case 200:
      const json = await res.json();

      localStorage.setItem("discordId", json.discordId);
      localStorage.setItem("auth-token", json.token);

      if (json.isConnected) {
        window.location.href = "./settings";
      } else {
        window.location.href = json.authUrl;
      }
      break;

    case 401:
      console.log("unauthorized", res.json());
      break;

    default:
      console.error("oops");
      break;
  }
}

const Login = () => {
  useEffect(() => {
    checkLogin()
  }, []);

  return (
    <div className="container">
      <p>Logging In</p>
    </div>
  )
}

export default Login;