import { RotatingLines } from "react-loader-spinner";

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  label?: string;
}

export const LoadingSpinner = ({
  fullScreen = true,
}: LoadingSpinnerProps) => {
  const content = (
    // <div className="flex flex-col items-center gap-3 rounded-lg border  px-6 py-5 text-sm font-medium text-gray-700 shadow-[0_12px_34px_rgba(0,0,0,0.12)] dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
      <RotatingLines
        visible={true}
        height="50"
        width="50"
        color="gray"
        strokeWidth="5"
        animationDuration="0.75"
        ariaLabel="rotating-lines-loading"
        wrapperStyle={{}}
        wrapperClass=""
      />
    // </div>
  );

  if (!fullScreen) {
    return (
      <div role="status" aria-label={'Loading...'} className="inline-flex">
        {content}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label={'Loading...'}
      className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-950"
    >
      {content}
    </div>
  );
};

export default LoadingSpinner;
