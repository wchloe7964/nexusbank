'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Dialog } from '@/components/ui/dialog'
import { accountColors, accountIcons } from '@/lib/constants/account-preferences'
import { Pencil } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { updateAccountPreferences } from '../preferences-actions'

interface AccountPreferencesDialogProps {
  accountId: string
  currentNickname: string | null
  currentColor: string
  currentIcon: string
  currentHidden: boolean
  accountName: string
}

export function AccountPreferencesDialog({
  accountId,
  currentNickname,
  currentColor,
  currentIcon,
  currentHidden,
  accountName,
}: AccountPreferencesDialogProps) {
  const [open, setOpen] = useState(false)
  const [nickname, setNickname] = useState(currentNickname || '')
  const [color, setColor] = useState(currentColor || 'blue')
  const [icon, setIcon] = useState(currentIcon || 'wallet')
  const [hideFromDashboard, setHideFromDashboard] = useState(currentHidden)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleOpen() {
    setNickname(currentNickname || '')
    setColor(currentColor || 'blue')
    setIcon(currentIcon || 'wallet')
    setHideFromDashboard(currentHidden)
    setError('')
    setOpen(true)
  }

  function handleSave() {
    setError('')
    startTransition(async () => {
      try {
        await updateAccountPreferences(accountId, {
          nickname: nickname.trim() || null,
          color,
          icon,
          hideFromDashboard,
        })
        setOpen(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to update preferences')
      }
    })
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleOpen}>
        <Pencil className="mr-2 h-3.5 w-3.5" />
        Personalise
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Personalise Account">
        <div className="space-y-5">
          {/* Nickname */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nickname</label>
            <Input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={accountName}
              maxLength={30}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">{nickname.length}/30 characters</p>
          </div>

          {/* Color Picker */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Colour</label>
            <div className="mt-2 flex gap-2 flex-wrap">
              {accountColors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  className={cn(
                    'h-8 w-8 rounded-full transition-all',
                    c.class,
                    color === c.id ? 'ring-2 ring-offset-2 ring-offset-background ' + c.ring : 'opacity-60 hover:opacity-100'
                  )}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Icon</label>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {accountIcons.map((ic) => {
                const Icon = ic.icon
                return (
                  <button
                    key={ic.id}
                    type="button"
                    onClick={() => setIcon(ic.id)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-lg border p-2.5 transition-colors',
                      icon === ic.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', icon === ic.id ? 'text-primary' : 'text-muted-foreground')} />
                    <span className="text-[10px] text-muted-foreground">{ic.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Hide from Dashboard */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Hide from Dashboard</p>
              <p className="text-xs text-muted-foreground">Account won&apos;t show on the main dashboard</p>
            </div>
            <Switch
              checked={hideFromDashboard}
              onCheckedChange={setHideFromDashboard}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button variant="ghost" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={isPending}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
