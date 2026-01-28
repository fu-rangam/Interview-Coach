import React, { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '../components/ui/select';
import { X } from 'lucide-react';
import { TECH_ROLES, SERVICE_ROLES } from '../types';

interface StandardRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: string) => void;
  currentRoleValue: string;
}

export const StandardRoleModal: React.FC<StandardRoleModalProps> = ({
  isOpen,
  onClose,
  onSelectRole,
  currentRoleValue,
}) => {
  const [selectedRole, setSelectedRole] = useState('');
  const [showConflictStep, setShowConflictStep] = useState(false);

  if (!isOpen) return null;

  const handleInitialSelection = () => {
    if (!selectedRole) return;

    // Check for conflict (if existing value is substantial and different)
    if (
      currentRoleValue &&
      currentRoleValue.trim().length > 0 &&
      currentRoleValue !== selectedRole
    ) {
      setShowConflictStep(true);
    } else {
      // No conflict, just apply
      onSelectRole(selectedRole);
      onClose();
    }
  };

  const confirmReplacement = () => {
    onSelectRole(selectedRole);
    onClose();
  };

  return (
    // Centering: Absolute positioning to cover the parent container
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md animate-scale-in">
        <Card className="p-0 overflow-visible border-border bg-background shadow-2xl rounded-3xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border bg-slate-50/50 rounded-t-3xl">
            <h3 className="text-xl font-display font-bold text-rangam-navy">
              {showConflictStep ? 'Confirm Change' : 'Standard Roles'}
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-rangam-blue transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            {!showConflictStep ? (
              // STEP 1: SELECT ROLE
              <div className="flex flex-col gap-6">
                <p className="text-sm text-slate-500">
                  Select a standardized role to auto-configure your session.
                </p>

                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-full h-12 rounded-xl border-slate-300 text-base focus:ring-rangam-blue focus:ring-offset-0">
                    <SelectValue placeholder="Select a role..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-96">
                    <SelectGroup>
                      <SelectLabel className="text-rangam-navy pl-2 py-2">
                        Service & Operations
                      </SelectLabel>
                      {SERVICE_ROLES.map((r) => (
                        <SelectItem
                          key={r}
                          value={r}
                          className="py-3 pl-8 cursor-pointer focus:bg-rangam-blue/10 focus:text-rangam-blue"
                        >
                          {r}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="text-rangam-navy pl-2 py-2 pt-4">
                        Corporate & Technical
                      </SelectLabel>
                      {TECH_ROLES.map((r) => (
                        <SelectItem
                          key={r}
                          value={r}
                          className="py-3 pl-8 cursor-pointer focus:bg-rangam-blue/10 focus:text-rangam-blue"
                        >
                          {r}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <div className="flex gap-3 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1 border-slate-300 text-slate-600"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-rangam-blue hover:bg-rangam-blue/90 text-white font-bold shadow-elevation-1"
                    onClick={handleInitialSelection}
                    disabled={!selectedRole}
                  >
                    Use Role
                  </Button>
                </div>
              </div>
            ) : (
              // STEP 2: CONFLICT CONFIRMATION
              <div className="flex flex-col gap-6">
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-sm text-blue-900">
                    This will replace your current role ("
                    <span className="font-semibold">{currentRoleValue}</span>") with "
                    <span className="font-semibold">{selectedRole}</span>".
                  </p>
                </div>

                <div className="flex gap-3 mt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowConflictStep(false)}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1 bg-rangam-navy text-white hover:bg-rangam-navy/90"
                    onClick={confirmReplacement}
                  >
                    Replace Role
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
