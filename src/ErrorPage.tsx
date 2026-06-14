import { useRouteError, isRouteErrorResponse, Link } from 'react-router';

export function ErrorPage() {
  const error = useRouteError();
  let errorMessage = 'An unexpected error occurred.';
  
  if (isRouteErrorResponse(error)) {
    errorMessage = error.statusText || error.data;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(to bottom, #000000, #111111)',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <h1 style={{ fontSize: '4rem', fontWeight: 800, marginBottom: '1rem', background: 'linear-gradient(135deg, #ff4d4d, #ff8c00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Oops!
      </h1>
      <p style={{ fontSize: '1.25rem', marginBottom: '2rem', color: 'rgba(255,255,255,0.7)' }}>
        Sorry, we couldn't find the page you're looking for.
      </p>
      <p style={{ fontSize: '1rem', marginBottom: '3rem', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
        {errorMessage}
      </p>
      <Link
        to="/"
        style={{
          padding: '12px 24px',
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '9999px',
          color: '#ffffff',
          textDecoration: 'none',
          fontWeight: 600,
          transition: 'all 0.3s ease',
        }}
      >
        Go back home
      </Link>
    </div>
  );
}
