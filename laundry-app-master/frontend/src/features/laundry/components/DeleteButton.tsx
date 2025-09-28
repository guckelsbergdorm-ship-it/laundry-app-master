import {MdDelete} from "react-icons/md";
import {Button, type ButtonProps} from "../../../components/Button.tsx";
import type {IconBaseProps} from "react-icons";

export function DeleteButton({rightAlign, iconProps, disabled, style, ...props}: ButtonProps & {
  rightAlign?: boolean,
  iconProps?: IconBaseProps
}) {
  return (
    <Button
      variant={disabled ? "empty" : "danger"}
      style={{
        padding: 'var(--padding-vertical)',
        marginLeft: rightAlign ? 'auto' : '.5rem',
        ...style
      }}
      disabled={disabled}
      {...props}
    >
      <MdDelete fill={disabled ? "var(--text-color)" : "var(--clr-light-a0)"} {...iconProps}/>
    </Button>
  )
}
