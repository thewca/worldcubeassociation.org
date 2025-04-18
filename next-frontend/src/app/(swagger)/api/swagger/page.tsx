import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function Documentation() {
  return <SwaggerUI url="/wcaAPI.yaml"></SwaggerUI>;
}
