import { getEncryptionColor } from "../../utils/encryption.ts";

export default function AuthenticationAndEncryptionText(props: {
  authentication: string;
  encryption: string;
  className?: string;
}) {
  return (
    <span
      className={`uppercase font-mono font-medium ${getEncryptionColor(props.encryption)}`}
    >
      {props.authentication}/{props.encryption}
    </span>
  );
}
