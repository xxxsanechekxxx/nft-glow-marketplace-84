import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'purchase';
  amount: string;
  created_at: string;
  status: 'pending' | 'completed' | 'failed';
  item?: string;
}

interface WalletOperationsProps {
  transactions: Transaction[];
  onDeposit: (amount: string) => void;
  onWithdraw: (amount: string) => void;
}

export const WalletOperations = ({
  transactions,
  onDeposit,
  onWithdraw,
}: WalletOperationsProps) => {
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    onWithdraw(withdrawAmount);
    setWithdrawAmount("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Wallet Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={() => onDeposit("0")}>
              <ArrowDownCircle className="w-4 h-4 mr-2" />
              Deposit
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <ArrowUpCircle className="w-4 h-4 mr-2" />
                  Withdraw
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Withdraw ETH</DialogTitle>
                  <DialogDescription>
                    Enter the amount of ETH you want to withdraw.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount (ETH)</label>
                    <Input
                      type="number"
                      step="0.000000000000000001"
                      min="0"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit">Confirm Withdrawal</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount (ETH)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.created_at}</TableCell>
                    <TableCell className="capitalize">{transaction.type}</TableCell>
                    <TableCell>{transaction.amount}</TableCell>
                    <TableCell className="capitalize">{transaction.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};