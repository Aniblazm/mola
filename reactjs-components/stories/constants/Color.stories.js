import React from 'react';
import styled from 'styled-components';

import { Text, Color } from '../../src';

const View = styled.div`
	display: flex;
	flex: 1;
`
const Container = styled.div`
	height: 90px;
	width: 80px;
	background-color: ${props => props.color};
`
const Box = styled.div`
	height: 80px;
	width: 80px;
	background-color: ${props => props.color};
`

export default {
	title: 'Constants|Color',
	component: Container,
};

export const Default = () => (

	<View>
		<Container>
			<Box
				color={Color.main}
			/>
			<Text>main</Text>
		</Container>
		<Container>
			<Box
				color={Color.secondary}
			/>
			<Text>secondary</Text>
		</Container>
	</View>
);
