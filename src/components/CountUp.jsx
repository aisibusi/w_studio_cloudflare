import { animate, useInView } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';

const countEase = [0.16, 1, 0.3, 1];

function getDecimalPlaces(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const [, decimalPart = ''] = String(value).split('.');
  return decimalPart.length;
}

function formatCount(value, separator, decimals) {
  const [integerPart, decimalPart] = Number(value).toFixed(decimals).split('.');
  const groupedInteger = separator
    ? integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
    : integerPart;

  return decimalPart ? `${groupedInteger}.${decimalPart}` : groupedInteger;
}

export default function CountUp({
  className = '',
  decimals = undefined,
  delay = 0,
  duration = 1.15,
  from = 0,
  separator = '',
  to = 0,
}) {
  const ref = useRef(null);
  const currentValueRef = useRef(Number(from) || 0);
  const lastAnimatedToRef = useRef(null);
  const targetValue = Number(to) || 0;
  const startValue = Number(from) || 0;
  const decimalPlaces = useMemo(
    () => decimals ?? Math.max(getDecimalPlaces(startValue), getDecimalPlaces(targetValue)),
    [decimals, startValue, targetValue],
  );
  const [displayValue, setDisplayValue] = useState(() => formatCount(startValue, separator, decimalPlaces));
  const isInView = useInView(ref, { once: true, amount: 0.4 });

  useEffect(() => {
    setDisplayValue(formatCount(currentValueRef.current, separator, decimalPlaces));
  }, [decimalPlaces, separator]);

  useEffect(() => {
    if (!isInView || lastAnimatedToRef.current === targetValue) {
      return;
    }

    lastAnimatedToRef.current = targetValue;
    const controls = animate(currentValueRef.current, targetValue, {
      delay,
      duration,
      ease: countEase,
      onUpdate(value) {
        currentValueRef.current = value;
        setDisplayValue(formatCount(value, separator, decimalPlaces));
      },
    });

    return () => controls.stop();
  }, [decimalPlaces, delay, duration, isInView, separator, targetValue]);

  return (
    <span ref={ref} className={className}>
      {displayValue}
    </span>
  );
}
