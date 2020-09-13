import "./help.css";

import showdown from "showdown";
//@ts-ignore don't feel like writing a type for one spot. it's text
import README from "../../../@plugins/fit/README.md";

const converter = new showdown.Converter({
  tables: true
});

const helpHTML = converter.makeHtml(README);

const Help = () => (
  <div className="container">
    <Logo/>

    <article className="_help" dangerouslySetInnerHTML={{__html: helpHTML}}></article>
</div>
)


const Logo = () => (
  <h2 style={{textAlign: "center"}}>
    <img src="https://imgur.com/An9zxCP.jpg" style={{width: "2em"}}/>
    <p>+</p>
    <img src="https://imgur.com/LNBR93w.jpg" style={{width: "3em"}}/>
  </h2>
)

export default Help;