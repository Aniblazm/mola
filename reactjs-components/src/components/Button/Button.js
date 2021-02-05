import React from 'react';
import styled from 'styled-components';

import Color from '../../constants/Color';
import Text from '../Text/Text';

const Container = styled.button`
    padding: 16px;
    color: white;
    background-color: ${Color.main};
    cursor: ${props => !props.disabled && 'pointer'};
    border: none;
    height: 56px;
    border-radius: 4px;
    opacity: ${props => props.disabled ? 0.5 : 1.0};
    outline: none;

    :hover{
        background-color: ${props => !props.disabled && Color.secondary};
    }

    ${props => props.style};
`

const Button = props =>{

    return(
        <Container
            {...props}
        >
            <Text>{props.text}</Text>
        </Container>
    )
}
export default Button;