import { render, screen } from '@testing-library/react';
import Loader from './Loader';

describe('Loader component', () => {
  it('renders processing text', () => {
    render(<Loader />);
    expect(screen.getByText(/Processing.../i)).toBeInTheDocument();
  });
});
