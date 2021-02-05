import React from 'react';
import { action } from '@storybook/addon-actions';
import { text } from '@storybook/addon-knobs';

import Input from '../../src/components/Input/Input';
import SearchInput from '../../src/components/Input/SearchInput';

export default {
	title: 'Components|Input',
	component: Input
};

export const Default = () => (

	<Input
        placeholder={text('placeholder', 'Placeholder')}
        onChange={(action('onChange'))}
    />
);

export const Search = () => (

	<SearchInput
        placeholder={text('placeholder', 'Placeholder')}
        onChange={(action('onChange'))}
    />
);
