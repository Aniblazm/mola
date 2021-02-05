import React from 'react';
import styled from 'styled-components';

const P = styled.p`
	padding: 0px;
	margin: 0px;
	font-family: 'Muli';
	font-size: 16px;
	${props => props.style}
`

const Text = props =>{

	return(
		<P
			style={props.style}
		>
			{props.children}
		</P>
	)
}
export default Text;