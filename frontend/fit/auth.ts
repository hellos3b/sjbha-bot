export function authHeaders() {
  return {
    "Authorization": localStorage.getItem("auth-token"),
    "Content-Type": "application/json"
  }
}