/** The * after the label of a required field. The field itself carries aria-required. */
export function RequiredMark() {
  return (
    <span aria-hidden className="ml-0.5 text-red-600">
      *
    </span>
  );
}
