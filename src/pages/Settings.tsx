import React from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h4 text-text-primary">Settings</h1>
        <p className="text-body2 text-text-secondary mt-1">
          Manage your application settings and preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-h6 text-text-primary mb-4">General Settings</h3>
          <div className="space-y-4">
            <Input
              label="Application Name"
              defaultValue="IB Dashboard"
              placeholder="Enter application name"
            />
            <Input
              label="Support Email"
              defaultValue="support@example.com"
              placeholder="Enter support email"
            />
            <Input
              label="Timezone"
              defaultValue="UTC"
              placeholder="Select timezone"
            />
          </div>
          <div className="mt-6">
            <Button>Save Changes</Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-h6 text-text-primary mb-4">Security Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">Two-Factor Authentication</p>
                <p className="text-xs text-text-tertiary">Add an extra layer of security</p>
              </div>
              <Button variant="outline" size="sm">Enable</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">Session Timeout</p>
                <p className="text-xs text-text-tertiary">Automatically log out after inactivity</p>
              </div>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

