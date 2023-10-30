import { useState } from 'react'
import './index.css'

function PersonReact (props) {
    
    let [mouseOver, setMouseOver] = useState(false);
    let [relativeStartPosX, setRelativeStartPosX] = useState("0");
    let [relativeStartPosY, setRelativeStartPosY] = useState("0");

    return (
    <>
    <a target="_blank" rel="noreferrer" href={"http://wikipedia.org/wiki"+props.person.wikipediaUrl}>
     <div className={"person"} onMouseEnter={() => {setMouseOver(true)}} onMouseLeave={() => {setMouseOver(false)}}
     style={{display:"flex", flexDirection:"row", left:props.person.xOffset + "%", top:props.person.yOffset + "%", zIndex: (mouseOver ? 2 : 1)}}>
        <img src={props.person.imgUrl} style={{  height:"4em", opacity: "0.9"}}/>
        <div className="personText" style={{whiteSpace:"nowrap"}}>
            {props.person.personName}
            <br/>
            {props.person.born + " - "+props.person.died}
        </div>
    </div>
    </a>
    </>
  )
}

export default PersonReact