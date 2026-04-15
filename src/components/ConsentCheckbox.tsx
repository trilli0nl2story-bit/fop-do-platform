interface ConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  onNavigate?: (page: string) => void;
}

export function ConsentCheckbox({ checked, onChange, onNavigate }: ConsentCheckboxProps) {
  const handleLink = (page: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate?.(page);
  };

  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative flex-shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
          required
        />
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            checked
              ? 'bg-blue-500 border-blue-500'
              : 'border-gray-300 group-hover:border-blue-400 bg-white'
          }`}
        >
          {checked && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
      <span className="text-sm text-gray-600 leading-relaxed">
        Я принимаю условия{' '}
        {onNavigate ? (
          <button
            type="button"
            onClick={handleLink('terms')}
            className="text-blue-500 hover:underline"
          >
            пользовательского соглашения
          </button>
        ) : (
          <span className="text-blue-500">пользовательского соглашения</span>
        )}{' '}
        и согласен на обработку персональных данных в соответствии с{' '}
        {onNavigate ? (
          <>
            <button
              type="button"
              onClick={handleLink('privacy')}
              className="text-blue-500 hover:underline"
            >
              политикой
            </button>{' '}
            и{' '}
            <button
              type="button"
              onClick={handleLink('consent')}
              className="text-blue-500 hover:underline"
            >
              согласием на обработку данных
            </button>
          </>
        ) : (
          <span className="text-blue-500">политикой конфиденциальности</span>
        )}
        .
      </span>
    </label>
  );
}
