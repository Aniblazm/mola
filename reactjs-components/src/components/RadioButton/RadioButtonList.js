import React, { useState } from 'react';
import styled from 'styled-components';

import RadioButton from './RadioButton';

const Container = styled.div`

`

const RadioButtonList = props =>{

    const [ selectedItem, setSelectedItem ] = useState(undefined);

    const onButtonChange = item =>{
        setSelectedItem(item);
    }

    return(
        <Container>
            {props.options.map((item, index) =>(
                <RadioButton
                    key={'RadioButton'+index}
                    style={{marginBottom: 8}}
                    title={item.title}
                    selected={selectedItem && item.title === selectedItem.title}
                    onChange={() => onButtonChange(item)}
                />
            ))}
        </Container>
    )
}
export default RadioButtonList;