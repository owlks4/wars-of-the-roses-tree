import { useState } from 'react'
import './index.css'

function PersonReact (props) {
    
    let [mouseOver, setMouseOver] = useState(false);
    let [relativeStartPosX, setRelativeStartPosX] = useState("0");
    let [relativeStartPosY, setRelativeStartPosY] = useState("0");

    return (
    <>
    <a target="_blank" rel="noreferrer" href={"http://wikipedia.org/wiki"+props.person.wikipediaUrl}>
     <div className={"person " + props.person.house} onMouseEnter={() => {setMouseOver(true)}} onMouseLeave={() => {setMouseOver(false)}}
     style={{display:"flex", flexDirection:"row", left:props.person.xOffset + "%", top:props.person.yOffset + "%", zIndex: (mouseOver ? 2 : 1), fontSize:props.fontSizeEm}}>
        <div style={{position:"relative",minWidth:"3.2em", backgroundColor:"rgb(20,20,20)"}}>
            <img src={props.person.imgUrl} style={{verticalAlign:"middle", height:"4em", opacity: "0.9"}}/>
        </div>
        <div className="personText">
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