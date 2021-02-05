import React, { useState } from 'react';
import styled from 'styled-components';

import SearchIcon from '../../../assets/images/Search';

import Text from '../Text/Text';
import Color from '../../constants/Color';

const Container = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    border: ${props => props.isFocus ? '2px solid '+Color.secondary : '1px solid '+Color.lineColor};
    border-radius: 4px;
    padding-left: 12px;
    ${props => props.style}
`
const InputStyled = styled.input`
    display: flex;
    flex: 1;
    border: none;
    margin-top: 12px;
    margin-bottom: 8px;
    font-family: 'Muli';
    font-size: 18px;
    padding: 0px 10px;
    border-radius: 4px;
    outline: none;
`
const PlaceholderView = styled.div`
    position: absolute;
    top: -8px;
    left: 8px;
    padding: 0px 2px;
    background-color: white;
`
const AuxView = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
`

const SearchInput = props =>{

    const [ value, setValue ] = useState(undefined);
    const [ isFocus, setIsFocus ] = useState(false);
    const [ timer, setTimer ] = useState(0);
    const { style, ...inputProps } = props;

    const onInputChange = e =>{
        setValue(e.target.value);
        if (timer) clearTimeout(timer);
        setTimer(
            setTimeout(() => {
                inputProps.onChange && inputProps.onChange(e);
            }, 300)
        );
    }

    const onInputFocus = () =>{
        setIsFocus(true);
        inputProps.onFocus && inputProps.onFocus();
    }
    
    const onInputBlur = () =>{
        setIsFocus(false);
        inputProps.onBlur && inputProps.onBlur();
    }

    return(
        <Container
            style={style}
            isFocus={isFocus}
        >
            {(inputProps.placeholder && value) &&
                <PlaceholderView>
                    <Text
                        style={{fontSize: 14}}
                    >
                        {inputProps.placeholder}
                    </Text>
                </PlaceholderView>
            }
            <AuxView>
                <SearchIcon/>
                <InputStyled
                    {...inputProps}
                    onFocus={onInputFocus}
                    onBlur={onInputBlur}
                    onChange={onInputChange}
                />
            </AuxView>
        </Container>
    )
}
export default SearchInput;