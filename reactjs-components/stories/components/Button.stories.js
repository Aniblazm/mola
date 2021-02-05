import React from 'react';
import { action } from '@storybook/addon-actions';
import { text, boolean } from '@storybook/addon-knobs';

import Button from '../../src/components/Button/Button';
import ButtonImage from '../../src/components/Button/ButtonImage';

export default {
	title: 'Components|Button'
};

export const Default = () => (
	<Button
        text={text('text', 'button text')}
        disabled={boolean('disabled', false)}
        onClick={action('onClick')}
    />
);

export const ButtonWithImage = () => (
	<ButtonImage
        text={text('text', 'text')}
        disabled={boolean('disabled', false)}
        src={'http://localhost:3006/static/media/arrow_back.17d350a7.svg'}
        onClick={action('onClick')}
    />
);
