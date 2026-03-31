import { memo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBolt,
  faBug,
  faCircle,
  faDragon,
  faDroplet,
  faEye,
  faFeather,
  faFire,
  faGhost,
  faGem,
  faHandFist,
  faLeaf,
  faMoon,
  faMountain,
  faShield,
  faSkullCrossbones,
  faSnowflake,
  faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons'

const SLUG_TO_ICON = {
  normal: faCircle,
  fogo: faFire,
  agua: faDroplet,
  eletrico: faBolt,
  grama: faLeaf,
  gelo: faSnowflake,
  lutador: faHandFist,
  veneno: faSkullCrossbones,
  terra: faMountain,
  voador: faFeather,
  psiquico: faEye,
  inseto: faBug,
  pedra: faGem,
  fantasma: faGhost,
  dragao: faDragon,
  noturno: faMoon,
  aco: faShield,
  fada: faWandMagicSparkles,
}

function TypeIconInner({ slug, color, className = '', size = 'sm' }) {
  const icon = SLUG_TO_ICON[slug] ?? faCircle
  const sizeClass = size === 'lg' ? 'h-4 w-4' : 'h-3 w-3'
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${sizeClass} ${className}`}
      style={{ color }}
      aria-hidden
    >
      <FontAwesomeIcon icon={icon} className="!w-full !h-full" />
    </span>
  )
}

export default memo(TypeIconInner)
