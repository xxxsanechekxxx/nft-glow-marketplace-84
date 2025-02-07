import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { User, Settings, Mail, Key, LogOut, Wallet, ArrowUpCircle, ArrowDownCircle, Globe, UserRound, ShoppingBag, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import WalletAddressModal from "@/components/WalletAddressModal";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import DepositConfirmationDialog from "@/components/DepositConfirmationDialog";
import FraudWarningDialog from "@/components/FraudWarningDialog";
import { EmptyNFTState } from "@/components/EmptyNFTState";

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'purchase';
  amount: string;
  created_at: string;
  status: 'pending' | 'completed' | 'failed';
  item?: string;
}

interface UserData {
  id: string;
  email: string;
  login: string;
  country: string;
  avatar_url: string | null;
  balance: string;
  wallet_address?: string;
  erc20_address?: string;
  hide_nickname?: boolean;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isDepositConfirmationOpen, setIsDepositConfirmationOpen] = useState(false);
  const [isFraudWarningOpen, setIsFraudWarningOpen] = useState(false);
  const [hideNickname, setHideNickname] = useState(false);

  const showDelayedToast = (title: string, description: string, variant: "default" | "destructive" = "default") => {
    setTimeout(() => {
      toast({
        title,
        description,
        variant,
      });
    }, 1000);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      showDelayedToast("Success", "Logged out successfully");
      navigate("/");
    } catch (error) {
      showDelayedToast("Error", "Failed to log out", "destructive");
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError) throw authError;
        if (!currentUser) {
          console.log("No user found");
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();

        if (profileError) throw profileError;

        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (transactionsError) {
          console.error("Transactions error:", transactionsError);
          throw transactionsError;
        }

        if (isMounted && currentUser) {
          setUserData({
            id: currentUser.id,
            email: currentUser.email || '',
            login: profileData?.login || currentUser.user_metadata?.login || '',
            country: profileData?.country || currentUser.user_metadata?.country || '',
            avatar_url: null,
            balance: Number(profileData?.balance || 0).toFixed(1),
            wallet_address: profileData?.wallet_address || '',
            hide_nickname: profileData?.hide_nickname || false
          });
          setHideNickname(profileData?.hide_nickname || false);

          setTransactions(transactionsData?.map(tx => ({
            id: tx.id,
            type: tx.type,
            amount: tx.amount.toString(),
            created_at: new Date(tx.created_at).toISOString().split('T')[0],
            status: tx.status,
            item: tx.item
          })) || []);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (isMounted) {
          showDelayedToast("Error", "Failed to fetch user data. Please try again.", "destructive");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchUserData();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const handleHideNicknameChange = async (checked: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ hide_nickname: checked })
        .eq('user_id', userData?.id);

      if (error) throw error;

      setHideNickname(checked);
      showDelayedToast(
        "Success",
        `Nickname visibility ${checked ? 'hidden' : 'visible'}`
      );
    } catch (error) {
      console.error("Error updating nickname visibility:", error);
      showDelayedToast(
        "Error",
        "Failed to update nickname visibility",
        "destructive"
      );
    }
  };

  const handleGenerateWalletAddress = async (address: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ wallet_address: address })
        .eq('user_id', userData?.id);

      if (error) throw error;

      setUserData(prev => prev ? { ...prev, wallet_address: address } : null);
      
      showDelayedToast("Success", "Wallet address has been generated and saved.");
    } catch (error) {
      console.error("Error saving wallet address:", error);
      showDelayedToast("Error", "Failed to save wallet address. Please try again.", "destructive");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      showDelayedToast("Error", "New passwords do not match", "destructive");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      showDelayedToast("Success", "Password has been updated");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      showDelayedToast("Error", "Failed to update password", "destructive");
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const withdrawAmountNum = parseFloat(withdrawAmount);
    const balanceNum = parseFloat(userData?.balance || "0");
    
    if (withdrawAmountNum <= 0) {
      showDelayedToast("Error", "Please enter a valid amount greater than 0", "destructive");
      return;
    }

    if (withdrawAmountNum > balanceNum) {
      showDelayedToast(
        "Insufficient funds",
        `Your balance (${balanceNum} ETH) is less than the requested withdrawal amount`,
        "destructive"
      );
      return;
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: userData?.id,
            type: 'withdraw',
            amount: withdrawAmountNum,
            status: 'pending'
          }
        ]);

      if (error) throw error;

      showDelayedToast(
        "Withdrawal Requested",
        `Your withdrawal request for ${withdrawAmount} ETH has been submitted`
      );
      
      setWithdrawAmount("");
    } catch (error) {
      showDelayedToast(
        "Error",
        "Failed to process withdrawal. Please try again.",
        "destructive"
      );
    }
  };

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userData?.wallet_address) {
      showDelayedToast(
        "Error",
        "You need to generate a wallet address in your profile first",
        "destructive"
      );
      return;
    }

    setIsDepositConfirmationOpen(true);
  };

  const handleDepositConfirm = () => {
    setIsDepositConfirmationOpen(false);
    setIsFraudWarningOpen(true);
    setDepositAmount("");
    
    showDelayedToast(
      "Rejected",
      `Deposit of ${depositAmount} the rejected. Please contact our support team on Telegram for transaction verification`
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 mt-16">
        <div className="max-w-4xl mx-auto">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 mt-16 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="relative p-8 rounded-2xl overflow-hidden animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 animate-gradient" />
          <div className="relative flex items-center gap-6 z-10">
            <Avatar className="w-24 h-24 border-4 border-primary/20 animate-float shadow-xl">
              <AvatarFallback className="bg-gradient-to-br from-primary/80 to-purple-600">
                <UserRound className="w-12 h-12 text-white" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                @{userData?.login}
              </h1>
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-white" />
                <span className="text-lg font-semibold text-white">{userData?.balance} ETH</span>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4 p-1 bg-background/50 backdrop-blur-sm rounded-xl">
            {["profile", "settings", "wallet", "nft"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="flex items-center gap-2 capitalize transition-all duration-300 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
              >
                {tab === "profile" && <User className="w-4 h-4" />}
                {tab === "settings" && <Settings className="w-4 h-4" />}
                {tab === "wallet" && <Wallet className="w-4 h-4" />}
                {tab === "nft" && <ShoppingBag className="w-4 h-4" />}
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="profile">
            <Card className="border-primary/10 shadow-lg hover:shadow-primary/5 transition-all duration-300 backdrop-blur-sm bg-background/60">
              <CardHeader>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 group">
                    <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    <Input
                      value={userData?.email}
                      readOnly
                      className="bg-background/50 border-primary/10 group-hover:border-primary/30 transition-colors"
                    />
                  </div>
                  <div className="space-y-2 group">
                    <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                      <Globe className="w-4 h-4" />
                      Country
                    </label>
                    <Input
                      value={userData?.country}
                      readOnly
                      className="bg-background/50 border-primary/10 group-hover:border-primary/30 transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-2 group">
                  <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <Wallet className="w-4 h-4" />
                    Wallet Address
                  </label>
                  <div className="flex gap-4 items-start">
                    <div className="flex-grow flex gap-2 items-center">
                      <Input
                        value={userData?.wallet_address || ''}
                        readOnly
                        className="bg-background/50 font-mono text-sm border-primary/10 group-hover:border-primary/30 transition-colors"
                        placeholder="No wallet address generated"
                      />
                      {userData?.wallet_address && (
                        <Input
                          value="ERC-20"
                          readOnly
                          className="bg-background/50 w-24 text-sm text-center border-primary/10"
                        />
                      )}
                    </div>
                    {!userData?.wallet_address && (
                      <Button
                        onClick={() => setIsWalletModalOpen(true)}
                        className="bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                      >
                        Generate Address
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hide-nickname"
                    checked={hideNickname}
                    onCheckedChange={handleHideNicknameChange}
                  />
                  <label
                    htmlFor="hide-nickname"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Hide my nickname from other users
                  </label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="wallet">
            <div className="space-y-6">
              <Card className="border-primary/10 shadow-lg hover:shadow-primary/5 transition-all duration-300 backdrop-blur-sm bg-background/60">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                    <span>Wallet Operations</span>
                    <div className="text-sm font-normal flex items-center gap-1">
                      <span>My Limits - 0 / 5</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="w-4 h-4" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Due to the fact that you have only recently created your account,
                              we are forced to limit the number of orders that you can join.
                              This limit is updated every month.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button onClick={handleDeposit}>
                          <ArrowDownCircle className="w-4 h-4 mr-2" />
                          Deposit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Deposit ETH</DialogTitle>
                          <DialogDescription>
                            Enter the amount of ETH you want to deposit.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleDeposit} className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Amount (ETH)</label>
                            <Input
                              type="number"
                              step="0.000000000000000001"
                              min="0"
                              value={depositAmount}
                              onChange={(e) => setDepositAmount(e.target.value)}
                              placeholder="0.00"
                              required
                            />
                          </div>
                          <DialogFooter>
                            <Button type="submit">Continue</Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>

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

              <Card className="border-primary/10 shadow-lg hover:shadow-primary/5 transition-all duration-300 backdrop-blur-sm bg-background/60">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                    Transaction History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-primary/5">
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Amount (ETH)</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((transaction) => (
                            <TableRow
                              key={transaction.id}
                              className="hover:bg-primary/5 transition-colors"
                            >
                              <TableCell>{transaction.created_at}</TableCell>
                              <TableCell className="capitalize">{transaction.type}</TableCell>
                              <TableCell>{transaction.amount}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  transaction.status === 'completed'
                                    ? 'bg-green-500/20 text-green-500'
                                    : transaction.status === 'pending'
                                    ? 'bg-yellow-500/20 text-yellow-500'
                                    : 'bg-red-500/20 text-red-500'
                                }`}>
                                  {transaction.status}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No transactions found
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="nft">
            <Card className="border-primary/10 shadow-lg hover:shadow-primary/5 transition-all duration-300 backdrop-blur-sm bg-background/60">
              <CardHeader>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                  Your NFT Collection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EmptyNFTState />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <WalletAddressModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onGenerated={handleGenerateWalletAddress}
      />

      <DepositConfirmationDialog
        isOpen={isDepositConfirmationOpen}
        onClose={() => setIsDepositConfirmationOpen(false)}
        amount={depositAmount}
        onConfirm={handleDepositConfirm}
      />

      <FraudWarningDialog
        isOpen={isFraudWarningOpen}
        onClose={() => setIsFraudWarningOpen(false)}
      />
    </div>
  );
};

export default Profile;
