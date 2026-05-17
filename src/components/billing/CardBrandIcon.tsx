import {
  AmericanExpressFlatIcon,
  AmericanExpressLogoIcon,
  DinersClubFlatIcon,
  DinersClubLogoIcon,
  DiscoverFlatIcon,
  DiscoverLogoIcon,
  EloFlatIcon,
  EloLogoIcon,
  GenericFlatIcon,
  GenericLogoIcon,
  HipercardFlatIcon,
  HipercardLogoIcon,
  MastercardFlatIcon,
  MastercardLogoIcon,
  VisaFlatIcon,
  VisaLogoIcon,
} from 'react-svg-credit-card-payment-icons'

type IconComponent = React.ComponentType<{ width?: number | string }>

const FLAT_ICONS: Record<string, IconComponent> = {
  visa: VisaFlatIcon,
  mastercard: MastercardFlatIcon,
  master: MastercardFlatIcon,
  amex: AmericanExpressFlatIcon,
  americanexpress: AmericanExpressFlatIcon,
  'american express': AmericanExpressFlatIcon,
  elo: EloFlatIcon,
  hipercard: HipercardFlatIcon,
  hiper: HipercardFlatIcon,
  diners: DinersClubFlatIcon,
  dinersclub: DinersClubFlatIcon,
  'diners club': DinersClubFlatIcon,
  discover: DiscoverFlatIcon,
}

const LOGO_ICONS: Record<string, IconComponent> = {
  visa: VisaLogoIcon,
  mastercard: MastercardLogoIcon,
  master: MastercardLogoIcon,
  amex: AmericanExpressLogoIcon,
  americanexpress: AmericanExpressLogoIcon,
  'american express': AmericanExpressLogoIcon,
  elo: EloLogoIcon,
  hipercard: HipercardLogoIcon,
  hiper: HipercardLogoIcon,
  diners: DinersClubLogoIcon,
  dinersclub: DinersClubLogoIcon,
  'diners club': DinersClubLogoIcon,
  discover: DiscoverLogoIcon,
}

interface CardBrandIconProps {
  brand: string
  width?: number
  variant?: 'flat' | 'logo'
}

export default function CardBrandIcon({ brand, width = 40, variant = 'flat' }: CardBrandIconProps) {
  const key = brand.trim().toLowerCase()
  const map = variant === 'logo' ? LOGO_ICONS : FLAT_ICONS
  const fallback = variant === 'logo' ? GenericLogoIcon : GenericFlatIcon
  const Icon = map[key] ?? fallback
  return <Icon width={width} />
}
