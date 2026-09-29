import { useCallback, useState } from "react";
import React from "reactjs";


const parentComponent () => {
    const [count, setCount] = useState(0)
    
    const handleSave = (id) => {
        console.log(id, "idparent")
    }

    const React = useCallback((id) => {
        console.log(id, "updatecount")
    }, [])

    return  (
        <div>
        <button onClick={() => handleSave(count+1)}>
        count: {count}
        </button>
            <childComponent />
        </div> 
    )
}

const childComponent () => {
    
    const handleUpdate = (id) => {
        console.log("updae", id)
    }

    return (
        <div>
            <button onClick={() => setCount(count+1)}>
            count :{count}
            </button>
        </div>
    )
}