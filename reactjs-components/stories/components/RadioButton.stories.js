import React from 'react';
import { text, boolean, array } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';

import RadioButton from '../../src/components/RadioButton/RadioButton';
import RadioButtonList from '../../src/components/RadioButton/RadioButtonList';

export default {
	title: 'Components|RadioButton'
};

export const Default = () => (
    <RadioButton
        title={text('title', 'Titulo')}
        selected={boolean('selected', false)}
        onChange={action('onChange')}
    />
);

export const List = () => (
    <RadioButtonList
        options={array('options', [
            {
                id: 'option1',
                title: 'Opción 1'
            },
            {
                id: 'option2',
                title: 'Opción 2'
            },
            {
                id: 'option3',
                title: 'Opción 3'
            }
        ])}
        onChange={action('onChange')}
    />
);
