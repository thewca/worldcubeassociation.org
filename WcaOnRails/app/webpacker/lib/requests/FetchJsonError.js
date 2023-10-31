export default class FetchJsonError extends Error {
  constructor(message, response, json) {
    super(message);
    this.json = json;
  }
}
