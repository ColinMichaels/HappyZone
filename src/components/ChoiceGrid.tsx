interface ChoiceItem {
    value: string;
    title: string;
    copy: string;
    kicker?: string;
}

interface ChoiceGridProps {
    ariaLabel: string;
    items: ChoiceItem[];
    selectedValue: string | null;
    variant: 'mood' | 'focus';
    onSelect: (value: string) => void;
}

export function ChoiceGrid({ ariaLabel, items, selectedValue, variant, onSelect }: ChoiceGridProps) {
    return (
        <div className="choice-grid" role="radiogroup" aria-label={ariaLabel}>
            {items.map((item) => (
                <button
                    key={item.value}
                    type="button"
                    className={variant === 'mood' ? 'mood-choice' : 'focus-choice'}
                    data-active={item.value === selectedValue}
                    role="radio"
                    aria-checked={item.value === selectedValue}
                    onClick={() => onSelect(item.value)}
                >
                    {item.kicker ? <span className="choice-kicker">{item.kicker}</span> : null}
                    <span className="choice-title">{item.title}</span>
                    <span className="choice-copy">{item.copy}</span>
                </button>
            ))}
        </div>
    );
}
