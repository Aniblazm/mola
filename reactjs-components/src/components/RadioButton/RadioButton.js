import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import RadioButtonIcon from '../../../assets/images/RadioButton';
import Text from '../Text/Text';

const Container = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    cursor: pointer;
    ${props => props.style}
`

const RadioButton = props =>{

    const [ selected, setSelected ] = useState(props.selected);

    useEffect(() =>{
        setSelected(props.selected);
    }, [props.selected]);

    const onClick = () =>{
        setSelected(!selected);
        props.onChange && props.onChange(!selected);
    }

    return(
        <Container
            style={props.style}
            onClick={onClick}
        >
            <RadioButtonIcon 
                on={selected}
            />
            <Text
                style={{marginLeft: 6}}
            >
                {props.title}
            </Text>
        </Container>
    )
}
export default RadioButton;