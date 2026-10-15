import { ButtonLink } from '../../../components/ui/Button.tsx'
import { Card } from '../../../components/ui/Card.tsx'
import { CalculatorIcon, MessageIcon } from '../../../components/ui/icons.tsx'
import { CardGrid, HomeSection } from './HomeSection.tsx'

const TOOLS = [
  {
    title: 'CGPA calculator',
    text: 'Work out your GPA and CGPA on the Faculty of Pharmacy grading scale. Nothing you enter is stored or sent.',
    to: '/academics/cgpa-calculator',
    action: 'Open the calculator',
    Icon: CalculatorIcon,
  },
  {
    title: 'Feedback and suggestions',
    text: 'Send a suggestion, complaint or welfare concern to the Secretary General. You can stay anonymous.',
    to: '/connect/feedback',
    action: 'Give feedback',
    Icon: MessageIcon,
  },
]

/** Static: the two student tools. */
export function ToolsSection() {
  return (
    <HomeSection id="tools" title="Student tools" tone="alt">
      <CardGrid>
        {TOOLS.map(({ title, text, to, action, Icon }) => (
          <li key={to}>
            <Card as="article" className="h-full gap-3">
              <span className="text-text-brand">
                <Icon />
              </span>
              <h3>{title}</h3>
              <p className="text-text-muted">{text}</p>
              <div className="mt-auto pt-2">
                <ButtonLink to={to}>{action}</ButtonLink>
              </div>
            </Card>
          </li>
        ))}
      </CardGrid>
    </HomeSection>
  )
}
