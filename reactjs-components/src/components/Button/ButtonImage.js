import React from 'react';
import styled from 'styled-components';

import Text from '../../../src/components/Text/Text';
import Color from '../../../src/constants/Color';

const Container = styled.div`
    display: inline-flex;
    padding: 8px;
    border-radius: 4px;
    cursor: ${props => !props.disabled && 'pointer'};
    flex-direction: column;
    align-items: center;
    opacity: ${props => props.disabled ? 0.5 : 1.0};

    :hover{
        background-color: ${props => !props.disabled && Color.secondary}
    }
`
const Icon = styled.img`
    height: 24px;
    width: 24px;
`

const ButtonImage = props =>{

    const onButtonClick = () =>{
        if(!props.disabled)
            props.onClick && props.onClick();
    }

    return(
        <Container
            {...props}
            onClick={onButtonClick}
        >
            <Icon
                src={props.src}
            />
            {props.text &&
                <Text
                    style={{marginTop: 2, fontSize: 14}}
                >
                    {props.text}
                </Text>
            }
        </Container>
    )
}
export default ButtonImage;