import React from 'react';
import styled from 'styled-components';

import Text from '../../src/components/Text/Text';

const View = styled.div`
	display: flex;
	flex: 1;
`

export default {
	title: 'Components|Text',
	component: Text,
};

export const Default = () => (

	<View>
		<Text>Texto plano</Text>
	</View>
);
