export default class FetchJsonError extends Error {
  constructor(message, response, json) {
    super(message);

    this.response = response;
    this.json = json;
  }
}
