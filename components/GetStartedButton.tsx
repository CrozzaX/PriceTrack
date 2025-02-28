'use client';

export default function GetStartedButton() {
  const handleClick = () => {
    const authUI = document.querySelector('[data-auth-ui]');
    if (authUI) {
      const signupButton = authUI.querySelector('button:last-child') as HTMLButtonElement;
      signupButton?.click();
    }
  };

  return (
    <button 
      className="px-6 py-3 rounded-full font-semibold text-white bg-[#111827] hover:bg-opacity-90 transition"
      onClick={handleClick}
    >
      Get Started
    </button>
  );
} 